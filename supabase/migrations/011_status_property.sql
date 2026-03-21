-- Add `status` property type (special select grouped into not_started / in_progress / done).

ALTER DOMAIN public.property_value_type DROP CONSTRAINT property_value_type_check;

ALTER DOMAIN public.property_value_type ADD CONSTRAINT property_value_type_check CHECK (
  VALUE IN (
    'text',
    'number',
    'date',
    'boolean',
    'select',
    'multi_select',
    'status',
    'relation',
    'url',
    'email',
    'phone',
    'person',
    'file',
    'checkbox',
    'formula',
    'rollup',
    'created_time',
    'last_edited_time',
    'created_by',
    'last_edited_by',
    'location'
  )
);

COMMENT ON DOMAIN public.property_value_type IS
  'Allowed property schema / property value kinds, including status.';
