-- 254 = max length of an email address (RFC 5321).
-- not valid: new and updated rows are checked, existing rows are not scanned, so the migration cannot fail on
-- projects that already hold longer (junk) addresses.
alter table public.waitlist
  add constraint waitlist_email_length check (char_length(email) <= 254) not valid;
