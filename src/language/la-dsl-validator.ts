import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { Entity, LaDslAstType } from './generated/ast.js';
import type { LaDslServices } from './la-dsl-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: LaDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.LaDslValidator;
    const checks: ValidationChecks<LaDslAstType> = {
        Entity: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class LaDslValidator {

    checkPersonStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
        if (entity.name) {
            const firstChar = entity.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: entity, property: 'name' });
            }
        }
    }

}
