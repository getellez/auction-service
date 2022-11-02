const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      required: ['title'],
      properties: {
        title: {
          type: 'string', 
        }
      }
    }
  },
  required: ['body']
}

export default schema;