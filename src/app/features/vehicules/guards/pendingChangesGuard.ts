import { CanDeactivateFn } from '@angular/router';
import { NgForm } from '@angular/forms';

export const pendingChangesGuard: CanDeactivateFn<any> = (cmp) => {
  const form: NgForm | undefined = cmp?.f ?? undefined; // ou expose un flag `dirty`
  const dirty = form ? form.dirty : (cmp?.loading?.() ?? false);
  return dirty ? confirm('Abandonner les modifications ?') : true;
};
