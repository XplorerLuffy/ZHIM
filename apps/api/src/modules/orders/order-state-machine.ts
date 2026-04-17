import { BadRequestException } from '@nestjs/common';
import type { OrderStatus, UserRole } from '@zhim/types';

// Legal state transitions per actor
const TRANSITIONS: Record<OrderStatus, Partial<Record<UserRole | 'system', OrderStatus[]>>> = {
  pending: {
    restaurant_owner: ['confirmed', 'cancelled'],
    restaurant_staff: ['confirmed', 'cancelled'],
    customer:         ['cancelled'],
    system:           ['cancelled'],
  },
  confirmed: {
    restaurant_owner: ['preparing', 'cancelled'],
    restaurant_staff: ['preparing', 'cancelled'],
    system:           ['rider_assigned'],
  },
  preparing: {
    restaurant_owner: ['ready'],
    restaurant_staff: ['ready'],
  },
  ready: {
    system:           ['rider_assigned'],
    rider:            ['picked_up'],
  },
  rider_assigned: {
    rider:            ['picked_up'],
    system:           ['cancelled'],
  },
  picked_up: {
    rider:            ['delivered'],
  },
  delivered: {},   // terminal
  cancelled: {},   // terminal
  refunded:  {},   // terminal
};

export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: UserRole | 'system',
): void {
  const allowed = TRANSITIONS[from]?.[actor] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Cannot transition order from '${from}' to '${to}' as '${actor}'`,
    );
  }
}

export function getStatusMessage(status: OrderStatus): { en: string; dz: string } {
  const messages: Record<OrderStatus, { en: string; dz: string }> = {
    pending:        { en: 'Waiting for restaurant to confirm', dz: 'ཟ་ཁང་གིས་ལེན་རྒྱུ་བལྟ་དོ།' },
    confirmed:      { en: 'Restaurant has confirmed your order', dz: 'ཟ་ཁང་གིས་བཀྱེད་ཚར།' },
    preparing:      { en: 'Your food is being prepared', dz: 'ཁ་ཟས་སྒྲིག་བཞིན།' },
    ready:          { en: 'Order is ready for pickup', dz: 'སྒྲིག་ཚར། ཕར་སྐྱིན་གྱི་བལྟ་དོ།' },
    rider_assigned: { en: 'A rider is on the way to pick up your order', dz: 'སྐྱིན་པ་འབྱོན་བཞིན།' },
    picked_up:      { en: 'Your order is on the way!', dz: 'ཁ་ཟས་སྐྱིན་བཞིན།' },
    delivered:      { en: 'Delivered! Enjoy your meal 🙏', dz: 'སྐྱིན་ཚར། ཞིམ་པོ་ཟ།' },
    cancelled:      { en: 'Order cancelled', dz: 'ལོག་གཏང་ཚར།' },
    refunded:       { en: 'Refund processed', dz: 'དངུལ་ལོག་འཐུས།' },
  };
  return messages[status];
}
