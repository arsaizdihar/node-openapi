import bcrypt from 'bcryptjs';
import { inject, injectable } from 'inversify';
import {
  LoginDTO,
  RegisterDTO,
  UserCreateDTO,
  UserDTO,
  UserEntity,
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

@injectable()
export class UserService {
  constructor(
    @inject(UserRepository)
    private readonly userRepository: UserRepository,
    @inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDTO): Promise<{ user: UserDTO; token: string }> {
    const user = await this.userRepository.getUserByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    return {
      user: this.toDTO(user),
      token: this.getToken(user),
    };
  }

  async register(dto: RegisterDTO): Promise<{ user: UserDTO; token: string }> {
    const { password, ...rest } = dto;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.userRepository.createUser({
      ...rest,
      password: hashedPassword,
    });

    if (!user) {
      throw new UserAlreadyExistsError();
    }

    return { user: this.toDTO(user), token: this.getToken(user) };
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
    return user ? this.toDTO(user) : null;
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

    return this.toDTO(user);
  }

  async listUsers(params: UserListParams): Promise<UserListResponse> {
    const result = await this.userRepository.listUsers(params);

    return {
      ...result,
      users: result.users.map(this.toDTO),
    };
  }

  private toDTO(user: UserEntity): UserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
