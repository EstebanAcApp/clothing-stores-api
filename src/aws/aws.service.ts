import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsService {
    constructor(
        @Inject('AWS_S3_CLIENT') private readonly s3: InstanceType<typeof S3Client>,
        private readonly config: ConfigService,
    ) { }

    async getUploadPresignedUrl(
        id: string,
        fileName: string,
        mimeType: string,
    ): Promise<{ uploadUrl: string, key: string }> {
        const key = `${id}/${uuidv4().replace(/-/g, '').slice(0, 8)}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: this.config.get<string>('AWS_BUCKET_NAME'),
            Key: key,
            ContentType: mimeType,
        });

        const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });

        return {
            uploadUrl,
            key,
        };
    }

    async getDownloadPresignedUrl(
        key: string,
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.config.get<string>('AWS_BUCKET_NAME'),
            Key: key,
        });
        
        return getSignedUrl(this.s3, command, { expiresIn: 3600 });
    }

    async deleteObject(
        key: string,
    ) {
        const command = new DeleteObjectCommand({
            Bucket: this.config.get<string>('AWS_BUCKET_NAME'),
            Key: key,
        });

        try {
            await this.s3.send(command);
        } catch (error) {
            throw new InternalServerErrorException('Error deleting the object');
        }
    }
}
