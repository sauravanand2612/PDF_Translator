import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Generate URL Started")
    s3 = boto3.client('s3')
    request_id = context.aws_request_id
    bucket_name = os.environ['UPLOAD_BUCKET']

    dynamodb = boto3.client('dynamodb')
    table_name = 'TranslationStatus'

    # Default values
    from_lang = None
    to_lang = None

    logger.info(f"Event: {event}")
    # Determine HTTP method
    http_method = event.get('httpMethod', 'GET').upper()
    
    logger.info(f"HTTP Method: {http_method}")

    # Get from query string parameters
    from_lang = event.get('fromLang')
    to_lang = event.get('toLang')

    # Generate pre-signed URL (expires in 1 hour)
    url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': bucket_name,
            'Key': f"{request_id}.pdf"
        },
        ExpiresIn=3600
    )

    logger.info(f"from_lang: {from_lang}")
    logger.info(f"to_lang: {to_lang}")

    full_request_id = f"{request_id}.pdf"
    logger.info(f"Full Request ID: {full_request_id}")

    # ✅ Add row to DynamoDB
    try:
        dynamodb.put_item(
            TableName=table_name,
            Item={
                'request_id': {'S': full_request_id},
                'fromLang': {'S': from_lang or 'unknown'},
                'toLang': {'S': to_lang or 'unknown'},
                'status': {'S': 'URLGENERATED'}
            }
        )
        logger.info("Successfully inserted item into DynamoDB.")
    except Exception as e:
        logger.error(f"Failed to insert into DynamoDB: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'url': url,
            'request_id': request_id,
            'fromLang': from_lang,
            'toLang': to_lang
        }),
        'headers': {
            'Content-Type': 'application/json'
        }
    }
