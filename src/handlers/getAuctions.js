import AWS from 'aws-sdk';
import createError from 'http-errors'
import commonMiddleware from '../lib/commonMiddleware'
import getAuctionsSchema from '../lib/getAuctionSchema'
import validator from '@middy/validator'

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getAuctions = async (event, context) => {
  let auctions;
  const { status } = event.queryStringParameters;
  try {
    const result = await dynamodb.query({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      IndexName: 'statusAndEndDate',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeValues: {
        ':status': status,
      },
      ExpressionAttributeNames: {
        '#status': 'status'
      }
    }).promise()
    auctions = result.Items;
  } catch (error) {
    console.error(error)
    throw new createError.InternalServerError(error)
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auctions)
  }
}

export const handler = commonMiddleware(getAuctions).use(
  validator({
  inputSchema: getAuctionsSchema,
  ajvOptions: {
    useDefaults: true,
    strict: false
  }
}));