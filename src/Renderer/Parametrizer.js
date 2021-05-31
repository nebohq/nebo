import Parameters from '../Parameters';
import { evaluate, isNullish } from '../Utils';

const Parametrizer = ({
  id: componentId,
  params,
  prop,
  sourceType,
  passedProps,
}) => {
  const propParams = params.getBy({ id: componentId, type: sourceType, name: prop.name });

  const propParamsByName = propParams.reduce((acc, param) => {
    acc[param.name] = param;
    return acc;
  }, {});

  const propContent = prop.value.toString();
  const containers = Parameters.getContainers(propContent);

  let result = propContent;
  if (prop.type.stringLike) {
    result = Parametrizer.parseStringLike(
      containers, propParamsByName, passedProps, propContent,
    );
  } else if (containers.length > 0) {
    result = Parametrizer.parseContainer(containers[0], propParamsByName, passedProps);
  }

  return prop.type.convert(result);
};

Parametrizer.parseStringLike = (containers, paramsByName, passedProps, propContent) => {
  let currentPropContent = propContent;

  containers.forEach((container) => {
    const value = Parametrizer.parseContainer(container, paramsByName, passedProps);

    currentPropContent = currentPropContent.replace(
      container.input,
      isNullish(value) ? '' : value.toString(),
    );
  });

  return currentPropContent;
};

Parametrizer.parseContainer = (container, paramsByName, passedProps) => {
  const { content } = container;
  const single = content.match(Parameters.regularExpressions.param);
  let value;
  if (single) {
    value = Parametrizer.parseSingleParameterContainer(single, paramsByName, passedProps);
  } else {
    value = Parametrizer.parseMultiParameterContainer(content, paramsByName, passedProps);
  }
  return value;
};

Parametrizer.parseSingleParameterContainer = (match, paramsByName, passedProps) => {
  const param = paramsByName[match.groups.name];
  if (!param) return '';

  return Parametrizer.fromProps(param, passedProps);
};

Parametrizer.parseMultiParameterContainer = (containerContent, paramsByName, passedProps) => {
  const nestedMatches = [...containerContent.matchAll(Parameters.regularExpressions.nestedParams)];

  let currentContent = containerContent;
  const containerParams = [];
  nestedMatches.forEach((match) => {
    const param = paramsByName[match.groups.name];
    if (!param) return;
    containerParams.push(param);
    currentContent = currentContent.replace(match[0], param.name);
  });

  const args = containerParams.reduce((acc, param) => {
    acc[param.name] = Parametrizer.fromProps(param, passedProps);
    return acc;
  }, {});
  return evaluate(currentContent, args);
};

Parametrizer.fromProps = (param, passedProps) => {
  let value = param.defaultValue;
  if (param.name in passedProps) value = passedProps[param.name];

  return param.type.convert(value);
};

export default Parametrizer;
