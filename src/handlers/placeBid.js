import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors'
import validator from '@middy/validator'
import placeBidSchema from '../lib/schemas/placeBidSchema'
import { getAuctionById } from './getAuction';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const placeBid = async (event, context) => {
  let updatedAuction;
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const { amount } = event.body;
  const auction = await getAuctionById(id)
  if(auction.status !== 'OPEN'){
    throw new createError.Forbidden(`You can't bid on CLOSED auctions!`)
  }
  if (email === auction.seller) {
    throw new createError.Forbidden(`you cannot bid on your own auctions`)
  }
  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(`You are already the highest bidder`)
  }
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}!`)
  }
  
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': email
    },
    ReturnValues: 'ALL_NEW'
  }

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error)
    throw new createError.InternalServerError(error)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  }
}

export const handler = commonMiddleware(placeBid).use(
  validator({
    inputSchema: placeBidSchema,
    ajvOptions: {
      strict: false
    }
  })
)