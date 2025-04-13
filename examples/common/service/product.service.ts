import { inject, injectable } from 'inversify';
import {
  ProductCreateDTO,
  ProductDTO,
  ProductEntity,
  ProductListParams,
  ProductListResponse,
} from '../domain/product.domain';
import { ProductRepository } from '../repository/product.repository';
import { ProductNotFoundError } from '../errors/product.errors';

@injectable()
export class ProductService {
  constructor(
    @inject(ProductRepository)
    private readonly productRepository: ProductRepository,
  ) {}

  async createProduct(dto: ProductCreateDTO): Promise<ProductDTO> {
    const product = await this.productRepository.createProduct(dto);
    return this.toDTO(product);
  }

  async getProductById(id: string): Promise<ProductDTO | null> {
    const product = await this.productRepository.getProductById(id);
    return product ? this.toDTO(product) : null;
  }

  async updateProduct(
    id: string,
    dto: Partial<ProductCreateDTO>,
  ): Promise<ProductDTO> {
    const product = await this.productRepository.updateProduct(id, dto);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return this.toDTO(product);
  }

  async deleteProduct(id: string): Promise<ProductDTO | null> {
    const product = await this.productRepository.deleteProduct(id);

    return product ? this.toDTO(product) : null;
  }

  async listProducts(params: ProductListParams): Promise<ProductListResponse> {
    const result = await this.productRepository.listProducts(params);

    return {
      ...result,
      products: result.products.map(this.toDTO),
    };
  }

  async toggleProductStatus(id: string): Promise<ProductDTO> {
    const product = await this.productRepository.toggleProductStatus(id);
    return this.toDTO(product);
  }

  private toDTO(product: ProductEntity): ProductDTO {
    return {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
