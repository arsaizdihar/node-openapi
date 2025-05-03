import express from 'express';
import usersRouter from './routes/api/users';
import userRouter from './routes/api/user';
import profilesRouter from './routes/api/profiles';
import articlesRouter from './routes/api/articles';
import tagsRouter from './routes/api/tags';
import generalErrorHandler from './middleware/errorHandling/generalErrorHandler';
import {
  authErrorHandler,
  prismaErrorHandler,
} from './middleware/errorHandling';
import YAML from 'yaml';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const app = express();

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

app.use(authErrorHandler);

app.use(prismaErrorHandler);

app.use(generalErrorHandler);

export default app;
