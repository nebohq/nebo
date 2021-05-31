const associatePropType = (func, propTypeName) => {
  func.propTypeName = propTypeName;

  const propType = (isRequired) => (props, propName, componentName) => {
    // eslint-disable-next-line react/destructuring-assignment
    if (props[propName] == null && !isRequired) return null;

    // eslint-disable-next-line react/destructuring-assignment
    if (props[propName]?.constructor?.propTypeName !== propTypeName) {
      return new Error(`Invalid prop \`${propName}\` supplied to \`${componentName}\``);
    }

    return null;
  };

  func.propType = propType(false);
  func.propType.isRequired = propType(true);
};

export default associatePropType;
