import { port, str, ValidatorSpec } from 'envalid';
import * as envalid from 'envalid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validators: { [K in keyof any]: ValidatorSpec<any[K]> } = {
  NODE_ENV: str({
    choices: ['dev', 'test', 'prod', 'ci', 'local'],
    default: 'local',
  }),
  REDIS_HOST: str(),
  REDIS_PORT: port(),
};

export function validateEnv() {
  envalid.cleanEnv(process.env, validators);
}
