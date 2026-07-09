-- Keep university_id=1 (renamed from Haramaya to Jimma), remove duplicate id=3
-- Reassign any students linked to the duplicate (id=3) to id=1
UPDATE students SET university_id = 1 WHERE university_id = 3;

-- Reassign any university_users linked to id=3 to id=1
UPDATE university_users SET university_id = 1 WHERE university_id = 3;

-- Reassign any applications linked to id=3 to id=1
UPDATE applications SET university_id = 1 WHERE university_id = 3;

-- Delete the duplicate Jimma University (original id=3)
DELETE FROM universities WHERE university_id = 3;
