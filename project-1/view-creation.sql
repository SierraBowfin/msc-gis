CREATE TABLE administrative_poly AS
SELECT * FROM planet_osm_polygon WHERE not administrative is null;

CREATE VIEW amenity_poly AS
SELECT * FROM planet_osm_polygon WHERE not amenity is null;
CREATE VIEW amenity_point AS
SELECT * FROM planet_osm_point WHERE not amenity is null;

CREATE TABLE building_poly AS
SELECT * FROM planet_osm_polygon WHERE not building is null;

CREATE TABLE highway_poly AS
SELECT * FROM planet_osm_polygon WHERE not highway is null;
CREATE TABLE highway_line AS
SELECT * FROM planet_osm_line WHERE not highway is null;
CREATE TABLE highway_point AS
SELECT * FROM planet_osm_point WHERE not highway is null;

CREATE TABLE historic_poly AS
SELECT * FROM planet_osm_polygon WHERE not historic is null;
CREATE TABLE historic_point AS
SELECT * FROM planet_osm_point WHERE not historic is null;

CREATE TABLE landuse_poly AS
SELECT * FROM planet_osm_polygon WHERE not landuse is null;

CREATE TABLE leisure_poly AS
SELECT * FROM planet_osm_polygon WHERE not leisure is null;

CREATE TABLE natural_poly AS
SELECT * FROM planet_osm_polygon WHERE not "natural" is null;

CREATE TABLE power_poly AS
SELECT * FROM planet_osm_polygon WHERE not "power" is null;
CREATE TABLE power_line AS
SELECT * FROM planet_osm_line WHERE not "power" is null;
CREATE TABLE power_point AS
SELECT * FROM planet_osm_point WHERE not "power" is null;

CREATE TABLE railway_poly AS
SELECT * FROM planet_osm_polygon WHERE not railway is null;
CREATE TABLE railway_line AS
SELECT * FROM planet_osm_line WHERE not railway is null;
CREATE TABLE railway_point AS
SELECT * FROM planet_osm_point WHERE not railway is null;

CREATE TABLE shop_point AS
SELECT * FROM planet_osm_point WHERE not shop is null;

CREATE TABLE public_transport_point AS
SELECT * FROM planet_osm_point WHERE not public_transport is null;