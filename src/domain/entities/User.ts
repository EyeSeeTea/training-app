// TODO: Grow this into the app User entity, with a UserRepository; keep the DHIS2 shape in the repository.
export interface UserAuthorities {
    isSuperAdmin: boolean;
    authorities: ReadonlyArray<string>;
}

export const hasAuthorities = (user: UserAuthorities, requiredAuthorities: ReadonlyArray<string> = []): boolean =>
    user.isSuperAdmin || requiredAuthorities.every(authority => user.authorities.includes(authority));
