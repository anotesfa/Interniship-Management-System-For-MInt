-- Update university name from Haramaya to Jimma
UPDATE "universities"
SET name = 'Jimma University',
    contact_email = 'info@ju.edu.et',
    address = 'Jimma University, Ethiopia'
WHERE name = 'Haramaya University';

-- Update all user emails from @hu.edu.et to @ju.edu.et
UPDATE "users"
SET email = REPLACE(email, '@hu.edu.et', '@ju.edu.et')
WHERE email LIKE '%@hu.edu.et';

-- Update all student emails from @hu.edu.et to @ju.edu.et
UPDATE "students"
SET email = REPLACE(email, '@hu.edu.et', '@ju.edu.et')
WHERE email LIKE '%@hu.edu.et';
