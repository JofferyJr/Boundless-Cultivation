alter table public.boundless_multiplayer_trade_offers
  add constraint boundless_trade_currency_direction_check
  check (not (currency_amount > 0 and requested_currency_amount > 0 and currency_type = requested_currency_type));
