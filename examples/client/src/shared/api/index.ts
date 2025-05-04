import { store } from '~shared/store';
import { client } from './generated/client.gen';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';

export * from './generated';
export * from './generated/client.gen';

client.instance.interceptors.request.use((config) => {
  const token = store.getState().session?.token;
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

const ApiErrorDataDtoSchema = z.object({
  errors: z.record(z.string(), z.array(z.string())),
});

client.instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const validation = ApiErrorDataDtoSchema.safeParse(error.response?.data);

    if (!validation.success) {
      return Promise.reject(error);
    }

    const normalizedErrorResponse = {
      ...error.response!,
      data: normalizeValidationErrors(validation.data),
    };

    return Promise.reject(
      new AxiosError(
        error.message,
        error.code,
        error.config,
        error.request,
        normalizedErrorResponse,
      ),
    );
  },
);

function normalizeValidationErrors(
  data: z.infer<typeof ApiErrorDataDtoSchema>,
) {
  return Object.entries(data.errors).flatMap(([field, messages]) =>
    messages.map((message) => `${field} ${message}`),
  );
}

export type ApiErrorData = Array<string>;
