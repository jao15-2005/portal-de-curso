create database sistema_login;

use sistema_login;

create table usuarios(
	id int primary key not null auto_increment,
	username varchar(50) not null,
    email varchar(255) not null,
    password varchar(255)not null,
    recovery_token varchar(255),
    profile_pic longblob

    
);

select * from usuarios;
