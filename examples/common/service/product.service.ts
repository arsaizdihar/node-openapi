import { inject, injectable } from 'inversify';
import {
  ProductCreateDTO,
  ProductDTO,
  productEntityToDTO,
  ProductListParams,
  ProductListResponse,
} from '../domain/product.domain';
import { ProductNotFoundError } from '../errors/product.errors';
import { ProductRepository } from '../repository/product.repo';

@injectable()
export class ProductService {
  constructor(
    @inject(ProductRepository)
    private readonly productRepository: ProductRepository,
  ) {}

  async createProduct(dto: ProductCreateDTO): Promise<ProductDTO | null> {
    const product = await this.productRepository.createProduct(dto);
    return product ? productEntityToDTO(product) : null;
  }

  async getProductById(id: string): Promise<ProductDTO | null> {
    const product = await this.productRepository.getProductById(id);
    return product ? productEntityToDTO(product) : null;
  }

  async updateProduct(
    id: string,
    dto: Partial<ProductCreateDTO>,
  ): Promise<ProductDTO> {
    const product = await this.productRepository.updateProduct(id, dto);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return productEntityToDTO(product);
  }

  async deleteProduct(id: string): Promise<ProductDTO | null> {
    const product = await this.productRepository.deleteProduct(id);

    return product ? productEntityToDTO(product) : null;
  }

  async listProducts(params: ProductListParams): Promise<ProductListResponse> {
    const result = await this.productRepository.listProducts(params);

    return {
      ...result,
      products: result.products.map(productEntityToDTO),
    };
  }
}
