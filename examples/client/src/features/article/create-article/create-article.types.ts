import type { z } from 'zod'
import type { CreateArticleSchema } from './create-article.contract'

export type CreateArticle = z.infer<typeof CreateArticleSchema>
