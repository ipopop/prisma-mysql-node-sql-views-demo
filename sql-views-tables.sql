CREATE TABLE `SqlViews`.`User` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(256),
  `email` VARCHAR(256) UNIQUE
);

CREATE TABLE `SqlViews`.`Post` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(256),
  `content` VARCHAR(256),
  `published` BOOLEAN,
  `authorId` INT,
  CONSTRAINT `author` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`)
);
