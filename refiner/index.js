'use strict';

const util = require('../util');
const accessFlags = require('../access-flags');
const ConstantPool = require('./ConstantPool');
const CodeAttribute = require('./code-attribute')

class Refiner {
  constructor(cl) {
    this.cl = cl;
    this.constantPool = new ConstantPool(this.cl.constantPool);
  }

  declaration() {
    return {
      modifiers: util.modifiers(this.cl.accessFlags, accessFlags.class),
      name: this.constantPool.extractValue(this.cl.thisClass),
      super: 0 !== this.cl.superClass ? this.constantPool.extractValue(this.cl.superClass) : null
    };
  }

  fields() {
    return this.cl.fields.map((fieldInfo) => {
      return {
        modifiers: util.modifiers(fieldInfo.accessFlags, accessFlags.field),
        name: this.constantPool.extractValue(fieldInfo.nameIndex),
        type: this.constantPool.extractFieldType(fieldInfo.descriptorIndex)
      };
    });
  }

  methods() {
    return this.cl.methods.map((methodInfo) => {
      const name = this.constantPool.extractValue(methodInfo.nameIndex);
      const methodDescriptor = this.constantPool.extractMethodDescriptor(methodInfo.descriptorIndex);

      var code = methodInfo.attributes.length
      for (let i = 0; i < methodInfo.attributes.length; ++i) {
        var attributeName = this.constantPool.extractValue(methodInfo.attributes[i].attributeNameIndex);
        if (attributeName === "Code") {
          code = new CodeAttribute(methodInfo.attributes[i]);
          break;
        }
      }
      return {
        signature: methodDescriptor,
        modifiers: util.modifiers(methodInfo.accessFlags, accessFlags.method),
        name: name,
        code: code,
      };
    }).filter(Boolean);
  }
}

module.exports = function (cl) {
  const refiner = new Refiner(cl);
  const obj = refiner.declaration();
  obj.fields = refiner.fields(cl);
  obj.methods = refiner.methods(cl);

  return obj;
};
