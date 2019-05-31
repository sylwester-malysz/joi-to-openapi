# joi-to-openapi

This is a fork of [joi-to-openapi](https://github.com/sylwester-malysz/joi-to-openapi) with some new options. In short, in this package I've added joi extensions as supported type.

Now the library support to outputs for converted joi: standard output and file.

# examples

```javascript
const Joi = require("@hapi/joi");
const { convert } = require("joi-to-openapi");

let joi = Joi.extend(joi => ({
  base: joi
    .string()
    .isoDate()
    .description("Date in ISO format"),
  name: "date_start",
  language: {},
  rules: []
}));

console.log(convert(joi));
```

will output

```json
{
  "type": "string",
  "format": "date-time",
  "description": "Date in ISO format"
}
```

to write the output on a file

```javascript
const Joi = require("@hapi/joi");
const { convertToFile } = require("joi-to-openapi");

let joi = Joi.extend(joi => ({
  base: joi
    .string()
    .isoDate()
    .description("Date in ISO format"),
  name: "date_start",
  language: {},
  rules: []
}));

convertToFile(joi, "./");
```

will output

```json
{
  "type": "string",
  "format": "date-time",
  "description": "Date in ISO format"
}
```

in the date_start.json file (the file will be created by joi type plust json format).
