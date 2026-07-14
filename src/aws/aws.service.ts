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

    async getDownloadPresignedUrl(
        key: string,
    ) {
        const command = new GetObjectCommand({
            Bucket: this.config.get<string>('AWS_BUCKET_NAME'),
            Key: key,
        });

        try {
            return getSignedUrl(this.s3, command, { expiresIn: 3600 });
        } catch (error) {
            throw new InternalServerErrorException('Could not generate download URL (S3)');
        }
    }
    
    async getUploadPresignedUrl(
        id: string,
        fileName: string,
        mimeType: string,
    ) {
        const key = `${id}/${uuidv4().replace(/-/g, '').slice(0, 8)}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: this.config.get<string>('AWS_BUCKET_NAME'),
            Key: key,
            ContentType: mimeType,
        });

        try {
            const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });

            return {
                uploadUrl,
                key,
            };
        } catch (error) {
            throw new InternalServerErrorException('Could not generate upload URL (S3)');
        }
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
