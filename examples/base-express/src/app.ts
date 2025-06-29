import express, { NextFunction, Request, Response } from 'express';
import usersRouter from './routes/api/users';
import userRouter from './routes/api/user';
import profilesRouter from './routes/api/profiles';
import articlesRouter from './routes/api/articles';
import tagsRouter from './routes/api/tags';
import YAML from 'yaml';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import cors from 'cors';
import { HttpError } from 'ws-common/service/error.service';

const app = express();

app.use(cors());

const file = fs.readFileSync(path.join(__dirname, 'openapi.yml'), 'utf8');
const swaggerDocument = YAML.parse(file);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Allows parsing of json in the body of the request.
app.use(express.json());

app.use('/api/users', usersRouter);

app.use('/api/user', userRouter);

app.use('/api/profiles', profilesRouter);

app.use('/api/articles', articlesRouter);

app.use('/api/tags', tagsRouter);

app.get('/', function (_req, res) {
  res.send('This is just the backend for RealWorld');
});

// Simplified error handler (same as library version but without Zod)
function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      errors: {
        body: [err.message],
      },
    });
    next(err);
    return;
  }

  res.status(500).json({
    status: 500,
    errors: {
      body: ['Internal Server Error'],
    },
  });
  next(err);
}

app.use(errorHandler);

export default app;
