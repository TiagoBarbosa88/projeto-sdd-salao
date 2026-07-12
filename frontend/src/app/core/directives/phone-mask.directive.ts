import { Directive, ElementRef, HostListener, inject, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatPhoneInput } from '../utils/phone.util';

@Directive({
  selector: 'input[appPhoneMask]',
  standalone: true,
})
export class PhoneMaskDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  @Optional() @Self() private readonly ngControl = inject(NgControl, { self: true, optional: true });

  @HostListener('input')
  onInput(): void {
    this.applyMask(false);
  }

  @HostListener('blur')
  onBlur(): void {
    this.applyMask(true);
  }

  private applyMask(emitEvent: boolean): void {
    const input = this.el.nativeElement;
    const formatted = formatPhoneInput(input.value);
    if (input.value !== formatted) {
      input.value = formatted;
    }
    this.ngControl?.control?.setValue(formatted, { emitEvent });
  }
}
