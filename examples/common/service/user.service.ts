import bcrypt from 'bcryptjs';
import { inject, injectable } from 'inversify';
import {
  UserCreateDTO,
  UserDTO,
  UserEntity,
  userEntityToDTO,
  UserListParams,
  UserListResponse,
} from '../domain/user.domain';
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../errors/user.errors';
import { UserRepository } from '../repository/user.repo';
import { ConfigService } from './config.service';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { StoreService } from './store.service';
import { TransactionManager } from '../repository/transaction-manager';
import { LoginDTO, RegisterDTO } from '../domain/auth.domain';

@injectable()
export class UserService {
  constructor(
    @inject(UserRepository)
    private readonly userRepository: UserRepository,
    @inject(ConfigService)
    private readonly config: ConfigService,
    @inject(StoreService)
    private readonly storeService: StoreService,
    @inject(TransactionManager)
    private readonly transactionManager: TransactionManager,
  ) {}

  async login(dto: LoginDTO): Promise<{
    user: UserDTO;
    token: string;
    expiresIn: ms.StringValue;
  }> {
    const user = await this.userRepository.getUserByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    return {
      user: userEntityToDTO(user),
      token: this.getToken(user),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    };
  }

  async register(dto: RegisterDTO): Promise<{
    user: UserDTO;
    token: string;
    expiresIn: ms.StringValue;
  }> {
    const { password, email, name, ...rest } = dto;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.transactionManager.runInTransaction(async (tx) => {
      const user = await this.userRepository.createUser(
        {
          password: hashedPassword,
          email,
          name,
          role: rest.role,
        },
        tx,
      );

      if (!user) {
        throw new UserAlreadyExistsError();
      }

      if (rest.role === 'seller') {
        await this.storeService.createStore(
          userEntityToDTO(user),
          rest.store,
          tx,
        );
      }

      return user;
    });

    return {
      user: userEntityToDTO(user),
      token: this.getToken(user),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    };
  }

  getToken(user: UserEntity): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      this.config.get('JWT_SECRET'),
      { algorithm: 'HS256', expiresIn: this.config.get('JWT_EXPIRES_IN') },
    );
  }

  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      return jwt.verify(token, this.config.get('JWT_SECRET'), {
        algorithms: ['HS256'],
      }) as {
        userId: string;
        email: string;
      };
    } catch {
      return null;
    }
  }

  async getUserById(id: string): Promise<UserDTO | null> {
    const user = await this.userRepository.getUserById(id);
    return user ? userEntityToDTO(user) : null;
  }

  async updateUser(id: string, dto: Partial<UserCreateDTO>): Promise<UserDTO> {
    const { password, ...rest } = dto;

    const hashedPassword = password
      ? await bcrypt.hash(password, 12)
      : undefined;

    const user = await this.userRepository.updateUser(id, {
      ...rest,
      password: hashedPassword,
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    return userEntityToDTO(user);
  }

  async listUsers(params: UserListParams): Promise<UserListResponse> {
    const result = await this.userRepository.listUsers(params);

    return {
      ...result,
      users: result.users.map(userEntityToDTO),
    };
  }
}
