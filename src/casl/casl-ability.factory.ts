import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Leave } from 'src/leaves/leave.entity';
import { User } from 'src/users/user.entity';

type Actions = 'read' | 'update' | 'manage';

type Subjects = typeof Leave | typeof User | Leave | User | 'all' | 'own';

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<
      Ability<[Actions, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    switch (user.role) {
      case 'ADMIN':
        can('manage', 'all');
        break;
      case 'MEMBER':
        can('read', 'own');
        break;
    }

    return build({
      // Read https://casl.js.org/v5/en/guide/subject-type-detection#use-classes-as-subject-types for details
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
