import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { Entity, SemiformalWebAppsAstType } from './generated/ast.js';
import type { SWAServices } from './swa-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: SWAServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.SWAValidator;
    const checks: ValidationChecks<SemiformalWebAppsAstType> = {
        Entity: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class SWAValidator {

    checkPersonStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
        if (entity.name) {
            const firstChar = entity.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: entity, property: 'name' });
            }
        }
    }

}
