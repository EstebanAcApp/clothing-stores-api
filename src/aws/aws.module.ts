import { Global, Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

import { AwsService } from './aws.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'AWS_S3_CLIENT',
      useFactory: (config: ConfigService) => {
        const region = config.get<string>('AWS_REGION');
        const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');

        if (!region || !accessKeyId || !secretAccessKey) {
          throw new Error('AWS credentials are not correctly defined in the .env')
        }

        return new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService]
    },
    AwsService,
  ],
  exports: ['AWS_S3_CLIENT', AwsService],
})
export class AwsModule {}
