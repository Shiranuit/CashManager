/**
 * Ugly code written in 5 minutes to generate swagger documentation based on
 * comments in the code.
 * 
 * @TODO: Refactor this code
 */


const { parse } = require('comment-parser');
const config = require('./config');
const fs = require('fs');
const errors = require('../backend/lib/errors/errorCodes');
const path = require('path');

async function parseAction(controller, tags) {
  let start = false;
  const action = {
    name: '',
    description: '',
    params: [],
    bodyParams: [],
    successFields: [],
    errors: [],
  };
  for (const tag of tags) {
    if (tag.tag === 'openapi') {
      start = true;
      continue;
    } else if (!start) {
      continue;
    }

    if (tag.tag === 'action') {
      action.name = tag.name
    } else if (tag.tag === 'description') {
      action.description = tag.name + ' ' + tag.description;
    } else if (tag.tag === 'templateParam') {
      action.params.push({
        name: tag.name,
        type: tag.type,
      });
    } else if (tag.tag === 'bodyParam') {
      const cutPos = tag.type.indexOf(':');
      let type, example;
      if (cutPos !== -1) {
        type = tag.type.substring(0, cutPos);
        example = tag.type.substring(cutPos + 1);
      } else {
        type = tag.type;
      }

      if (example) {
        try {
          example = JSON.parse(example);
        } catch (e) {
          console.log(action)
          throw `Cant parse JSON ${example}`;
        }
      }

      action.bodyParams.push({
        name: tag.name,
        type,
        example,
        desc: tag.description,
      });
    } else if (tag.tag === 'successField') {

      const cutPos = tag.type.indexOf(':');
      let type, example;
      if (cutPos !== -1) {
        type = tag.type.substring(0, cutPos);
        example = tag.type.substring(cutPos + 1);
      } else {
        type = tag.type;
      }

      if (example) {
        try {
          example = JSON.parse(example);
        } catch (e) {
          console.log(action)
          throw `Cant parse JSON ${example}`;
        }
      }

      action.successFields.push({
        name: tag.name,
        type,
        example,
        desc: tag.description.length > 0 ? tag.description : undefined,
      });
    } else if (tag.tag === 'error') {
      action.errors.push(tag.name);
    } else if (tag.tag === 'return') {
      action.return = {
        type: tag.type,
        value: JSON.parse(tag.name)
      }
    }
  }

  if (!start) {
    return null;
  }

  return action;
}

async function main() {

  const template = JSON.parse(fs.readFileSync(`${__dirname}/template.json`).toString());

  const tags = [];
  const paths = {};

  for (const file of config.files) {
    
    const source = fs.readFileSync(`${__dirname}/${file}`).toString();
    const constrollerClass = require(`${__dirname}/${file}`);
    const controllerInstance = new constrollerClass();
    const controllerName = constrollerClass.name.replace('Controller', '').toLowerCase();

    const actions = {};

    const tag = controllerName.charAt(0).toUpperCase() + controllerName.slice(1);
    tags.push(tag);

    for (const action of controllerInstance.__actions) {
      actions[action.action] = {
        verb: action.verb,
        path: action.path,
      }
    }

    const parsed = parse(source);

    for (const method of parsed) {
      const tags = method.tags;
      const action = await parseAction(controllerName, tags);
      if (action) {

        action.verb = actions[action.name].verb;
        action.path = actions[action.name].path;

        const templatedPath = action.path.replace(/\/:([^/]+)/g,'/{$1}');
        let path = `/api/${controllerName}${templatedPath}`;

        const resultProperties = {};
        const params = [];

        for (const field of action.successFields) {
          resultProperties[field.name] = {
            type: field.type,
            description: field.desc,
            example: field.example,
          };
        }

        if (action.bodyParams.length > 0) {
          const properties = {};
          const paramStructure = {
            in: 'body',
            name: 'body',
            description: action.bodyDescription,
            required: true,
            schema: {
              type: 'object',
              properties: properties,
            }
          };
          for (const param of action.bodyParams) {
            properties[param.name] = {
              type: param.type,
              description: param.desc,
              example: param.example,
            };
          }
          params.push(paramStructure);
        }

        if (action.params.length > 0) {
          for (const param of action.params) {
            params.push({
              in: 'path',
              name: param.name,
              required: true,
              type: param.type,
              description: param.description,
            });
          }
        }

        const route = {
          tags: [
            tag
          ],
          description: action.description,
          produces: [
            'application/json'
          ],
          consumes: [
            'application/json'
          ],
          parameters: params,
          responses: {
            success: {
              description: 'Response when the request succeeded',
              schema: {
                type: 'object',
                properties: {
                  result: {
                    type: action.return ? action.return.type : 'object',
                    properties: action.return ? undefined : resultProperties,
                    example: action.return ? action.return.value : undefined
                  }
                }
              }
            }
          }
        };

        for (const errorName of action.errors) {
          const error = errors[errorName];
          if (!error) {
            throw `Error "${errorName}" not found`
          }
          const errorInstance = new error.type();
          route.responses[errorName] = {
            description: `Response when the error ${errorName} occurs`,
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: errorName,
                      description: 'Error ID'
                    },
                    type: {
                      type: 'string',
                      example: error.type.name,
                      description: 'Error Class Type'
                    },
                    stack: {
                      type: 'string',
                      description: 'Error StackTrace',
                      example: 'Error at ...'
                    },
                    message: {
                      type: 'string',
                      description: 'Error Message',
                      example: error.message
                    },
                    status: {
                      type: 'integer',
                      description: 'Status Code',
                      example: errorInstance.status
                    },
                  }
                }
              }
            }
          }
        }

        if (!paths[path]) {
          paths[path] = {
            [action.verb.toLowerCase()]: route
          };
        } else {
          paths[path][action.verb.toLowerCase()] = route;
        }
      }
    }
  }

  template.tags = tags;
  template.paths = paths;

  fs.writeFileSync(`${__dirname}/docapi.json`, JSON.stringify(template, null, 2));
}

main();