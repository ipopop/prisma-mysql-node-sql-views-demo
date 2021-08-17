CREATE VIEW Draft AS
    SELECT published, title, email, Post.id
    FROM Post, User
    WHERE published = false AND Post.authorId = User.id;
