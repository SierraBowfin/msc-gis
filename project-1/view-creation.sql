CREATE TABLE administrative_poly AS
SELECT * FROM planet_osm_polygon WHERE not administrative is null;
ALTER TABLE IF EXISTS public.administrative_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE VIEW amenity_poly AS
SELECT * FROM planet_osm_polygon WHERE not amenity is null;
CREATE TABLE amenity_point AS
SELECT * FROM planet_osm_point WHERE not amenity is null;
ALTER TABLE IF EXISTS public.amenity_point
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE building_poly AS
SELECT * FROM planet_osm_polygon WHERE not building is null;
ALTER TABLE IF EXISTS public.building_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE highway_poly AS
SELECT * FROM planet_osm_polygon WHERE not highway is null;
CREATE TABLE highway_line AS
SELECT * FROM planet_osm_line WHERE not highway is null;
CREATE TABLE highway_point AS
SELECT * FROM planet_osm_point WHERE not highway is null;
ALTER TABLE IF EXISTS public.highway_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );
ALTER TABLE IF EXISTS public.highway_line
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );
ALTER TABLE IF EXISTS public.highway_point
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE historic_poly AS
SELECT * FROM planet_osm_polygon WHERE not historic is null;
CREATE TABLE historic_point AS
SELECT * FROM planet_osm_point WHERE not historic is null;
ALTER TABLE IF EXISTS public.historic_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );
ALTER TABLE IF EXISTS public.historic_point
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE landuse_poly AS
SELECT * FROM planet_osm_polygon WHERE not landuse is null;
ALTER TABLE IF EXISTS public.landuse_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE leisure_poly AS
SELECT * FROM planet_osm_polygon WHERE not leisure is null;
ALTER TABLE IF EXISTS public.leisure_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE natural_poly AS
SELECT * FROM planet_osm_polygon WHERE not "natural" is null;
ALTER TABLE IF EXISTS public.natural_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE power_poly AS
SELECT * FROM planet_osm_polygon WHERE not "power" is null;
CREATE TABLE power_line AS
SELECT * FROM planet_osm_line WHERE not "power" is null;
CREATE TABLE power_point AS
SELECT * FROM planet_osm_point WHERE not "power" is null;
ALTER TABLE IF EXISTS public.power_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );
ALTER TABLE IF EXISTS public.power_line
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );
ALTER TABLE IF EXISTS public.power_point
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE railway_poly AS
SELECT * FROM planet_osm_polygon WHERE not railway is null;
CREATE TABLE railway_line AS
SELECT * FROM planet_osm_line WHERE not railway is null;
CREATE TABLE railway_point AS
SELECT * FROM planet_osm_point WHERE not railway is null;
ALTER TABLE IF EXISTS public.railway_poly
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );
ALTER TABLE IF EXISTS public.railway_line
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );
ALTER TABLE IF EXISTS public.railway_point
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE shop_point AS
SELECT * FROM planet_osm_point WHERE not shop is null;
ALTER TABLE IF EXISTS public.shop_point
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );

CREATE TABLE public_transport_point AS
SELECT * FROM planet_osm_point WHERE not public_transport is null;
ALTER TABLE IF EXISTS public.public_transport_point
    ADD COLUMN id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 );