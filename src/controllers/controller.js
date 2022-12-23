import bcrypt from 'bcrypt';
import { connection } from "../database/database.js";
import { v4 as uuid } from 'uuid';
import { nanoid } from 'nanoid'

export async function postSignUp(req, res) {
    const { name, email, password } = req.body;

    try {
        const userFound = await connection.query(`SELECT * FROM users WHERE email=$1`, [email]);
        if (userFound.rowCount > 0) return res.sendStatus(409);

        const hashPassword = bcrypt.hashSync(password, 10);
        await connection.query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3)`, [name, email, hashPassword]);
        return res.sendStatus(201);

    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);


    }
}
export async function postSignIn(req, res) {
    const { email, password } = req.body;
    const token = uuid();

    try {
        const checkUser = await connection.query(`SELECT * FROM users WHERE email=$1`, [email]);
        if (checkUser.rowCount === 0) return res.sendStatus(401);

        const user = checkUser.rows[0];
        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) return res.sendStatus(401);

        const checkSession = await connection.query(`SELECT * FROM sessions WHERE "userId"=$1`, [user.id]);
        if (checkSession.rowCount > 0) await connection.query(`UPDATE sessions SET token=$1 WHERE "userId"=$2`, [token, user.id]);
        else await connection.query(`INSERT INTO sessions ("userId", token) VALUES ($1, $2)`, [user.id, token]);

        res.send({ token });

    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }
}
export async function postUrlShorten(req, res) {
    const { url } = req.body;
    const { authorization } = req.headers;
    const token = authorization?.substring(7)

    let urlShort, urlFound;

    try {
        do {
            urlShort = nanoid(8);
            urlFound = await connection.query(`SELECT * FROM urls WHERE "shortUrl"=$1`, [urlShort]);
        } while (urlFound.rowCount > 0);

        const userQuery = await connection.query(`
          SELECT users.id FROM users JOIN sessions ON users.id = sessions."userId"
          WHERE sessions.token = $1
        `, [token]);
        const user = userQuery.rows[0];
        console.log(user)

        await connection.query(`INSERT INTO urls (url, "shortUrl", "userId") VALUES ($1, $2, $3)`, [url, urlShort, user.id]);
        res.status(201).send({ urlShort });
    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }
}
export async function getUrlById(req, res) {
    const { id } = req.params;

    try {
        const foundUrl = await connection.query(`SELECT id, "shortUrl", url FROM urls WHERE id=$1`, [id]);
        if (foundUrl.rowCount === 0) return res.sendStatus(404);
        res.send(foundUrl.rows[0]);
    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }
}
export async function openUrl(req, res) {
    const { shortUrl } = req.params;

    try {
        const foundUrl = await connection.query(`SELECT * FROM urls WHERE "shortUrl"=$1`, [shortUrl]);
        if (foundUrl.rowCount === 0) return res.sendStatus(404);

        const url = foundUrl.rows[0];
        await connection.query(`UPDATE urls SET "visitCount"=$1 WHERE id=$2`, [parseInt(url.visitCount) + 1, url.id])
        console.log(url.url)
        console.log(url.visitCount)
        res.redirect(url.url);
    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }
}
export async function deleteUrlById(req, res) {
    const { id } = req.params;
    const { authorization } = req.headers;
    const token = authorization?.substring(7)

    try {
        const foundUrl = await connection.query(`SELECT * FROM urls WHERE id=$1`, [id]);
        if (foundUrl.rowCount === 0) return res.sendStatus(404);
        const url = foundUrl.rows[0];

        const userQuery = await connection.query(`
      SELECT users.id FROM users JOIN sessions ON users.id = sessions."userId"
      WHERE sessions.token = $1
    `, [token]);
        const user = userQuery.rows[0];

        if (url.userId !== user.id) return res.sendStatus(401);

        await connection.query(`DELETE FROM urls WHERE id=$1`, [id])
        res.sendStatus(204);
    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }
}
export async function getUserMe(req, res) {
    const { authorization } = req.headers;
    const token = authorization?.substring(7)

    try {
        const query = await connection.query(`
        SELECT users.id, users.name, SUM(urls."visitCount") AS "visitCount",
        JSON_AGG(JSON_BUILD_OBJECT('id', users.id, 'shortUrl', urls."shortUrl", 'url', urls.url, 'visitCount', urls."visitCount")) AS "shortenedUrls"
        FROM users JOIN urls ON users.id = urls."userId" JOIN sessions ON users.id = sessions."userId"
        WHERE sessions.token = $1
        GROUP BY users.id
      `, [token]);

        console.log(query)
        if (query.rowCount === 0) res.sendStatus(404);
        res.send(query.rows[0]);

    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }
}
export async function getRanking(req, res) {
    try {
        const ranking = await connection.query(`
          SELECT users.id, users.name, COUNT(urls.id) AS "linksCount", COALESCE(SUM(urls."visitCount"), 0) AS "visitCount"
          FROM users
          LEFT JOIN urls ON users.id = urls."userId"
          GROUP BY users.id
          ORDER BY "visitCount" DESC, "linksCount" DESC
          LIMIT 10
        `);
        res.send(ranking.rows);
    } catch (err) {
        console.log(err.message);
        res.sendStatus(500);
    }

}