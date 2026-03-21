-- Allow `location` property type (address + lat/lng + place metadata as JSON value).

ALTER DOMAIN public.property_value_type DROP CONSTRAINT property_value_type_check;

ALTER DOMAIN public.property_value_type ADD CONSTRAINT property_value_type_check CHECK (
  VALUE IN (
    'text',
    'number',
    'date',
    'boolean',
    'select',
    'multi_select',
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
  'Allowed property schema / property value kinds (Notion-style), including location.';
