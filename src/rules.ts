import { RulesetDefinition, IFunctionResult } from "@stoplight/spectral-core";
import { pattern, truthy } from "@stoplight/spectral-functions";

/**
 * Custom function to verify that an array field (like decorators) contains "@Term".
 */
export function hasTermDecorator(
  targetVal: any,
  _opts: any,
  paths: any
): IFunctionResult[] {
  if (Array.isArray(targetVal) && targetVal.includes("@Term")) {
    return [];
  }
  return [
    {
      message: `Missing @Term decorator.`,
      path: paths,
    },
  ];
}

/**
 * Custom function to check that concept names are unique across namespaces.
 * This function is applied to the entire document.
 */
export function checkUniqueConceptNames(
  targetVal: any,
  _opts: any,
  _paths: any
): IFunctionResult[] {
  const errors: IFunctionResult[] = [];
  const seen = new Set<string>();

  if (!targetVal.namespaces || !Array.isArray(targetVal.namespaces)) {
    return errors;
  }

  targetVal.namespaces.forEach((namespace: any) => {
    if (namespace.concepts && Array.isArray(namespace.concepts)) {
      namespace.concepts.forEach((concept: any, idx: number) => {
        const name = concept.name;
        if (seen.has(name)) {
          errors.push({
            message: `Duplicate concept name '${name}' found.`,
            path: ["namespaces", namespace.name, "concepts", idx.toString()],
          });
        } else {
          seen.add(name);
        }
      });
    }
  });

  return errors;
}

export const ruleset: RulesetDefinition = {
  rules: {
    // Rule 1: Scalar declarations must be camelCase.
    scalarDeclarationNameCamelCase: {
      description: "Scalar declaration names must be in camelCase.",
      message: 'Declaration name "{{value}}" is not in camelCase.',
      severity: 2,
      given: "$.declarations[?(@.type=='scalar')].name",
      then: {
        function: pattern,
        functionOptions: { match: "^[a-z][a-zA-Z0-9]*$" },
      },
    },
    // Rule 2: Property names must be camelCase.
    propertyNameCamelCase: {
      description: "Property names must be in camelCase.",
      message: 'Property name "{{value}}" is not in camelCase.',
      severity: 2,
      given: "$.concepts[*].properties[*].name",
      then: {
        function: pattern,
        functionOptions: { match: "^[a-z][a-zA-Z0-9]*$" },
      },
    },
    // Rule 3: Disallow map types.
    disallowMaps: {
      description: "Map types are not allowed in Concerto models.",
      message: "Usage of maps is not allowed.",
      severity: 2,
      given: "$..[?(@.type=='map' || @.type=='Map')]",
      then: {
        function: truthy,
      },
    },
    // Rule 4: String properties must have a length validator.
    stringPropertiesLengthValidator: {
      description: "String properties must have a length validator.",
      message: 'String property "{{name}}" is missing a length validator.',
      severity: 2,
      given: "$.concepts[*].properties[?(@.type=='string')]",
      then: {
        function: truthy,
        field: "validators.length",
      },
    },
    // Rule 5: All declarations must include an @Term decorator.
    declarationTermDecorator: {
      description: "All declarations must have an @Term decorator.",
      message: 'Declaration "{{name}}" is missing @Term decorator.',
      severity: 2,
      given: "$.concepts[*]",
      then: {
        function: hasTermDecorator,
        field: "decorators",
      },
    },
    // Rule 6: All properties must include an @Term decorator.
    propertyTermDecorator: {
      description: "All properties must have an @Term decorator.",
      message: 'Property "{{name}}" is missing @Term decorator.',
      severity: 2,
      given: "$.concepts[*].properties[*]",
      then: {
        function: hasTermDecorator,
        field: "decorators",
      },
    },
    // Rule 7: All concepts in a namespace should extend a given base concept.
    conceptsExtendBase: {
      description:
        "All concepts must extend the base concept as specified in configuration.",
      message: 'Concept "{{name}}" must extend the required base concept.',
      severity: 2,
      given: "$.namespaces[*].concepts[*]",
      then: {
        function: pattern,
        field: "extends",
        functionOptions: { match: "^BaseConcept$" },
      },
    },
    // Rule 8: All concept names must be unique across namespaces.
    uniqueConceptNames: {
      description: "Concept names must be unique across namespaces.",
      message: "Duplicate concept name found.",
      severity: 2,
      // Apply the rule to the entire document to gather all concept names
      given: "$",
      then: {
        function: checkUniqueConceptNames,
      },
    },
  },
};
