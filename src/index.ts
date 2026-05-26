import { Hono } from 'hono';

const app = new Hono<{ Bindings: Cloudflare.Env }>();

// POST /submit
app.post("/submit", async (c) => {
    const { user, score } = c.req.query();
    const requestedScore = Number.parseInt(score);
    if (user == null || !(requestedScore >= 0)) {
        c.status(400);
        return c.text("Invalid value(s).");
    }
    const { results: current } = await c.env.DB.prepare(
        "SELECT score FROM highscores WHERE username = ?"
    ).bind(user).run();
    if (current.length > 0) {
        const currentScore = current[0].score as number;
        if (currentScore < requestedScore) {
            await c.env.DB.prepare(
                "UPDATE highscores SET score = ? WHERE username = ?"
            ).bind(requestedScore, user).run();
            return c.text("Highscore updated!");
        } else {
            return c.text("You haven't updated your high score.");
        }
    } else {
        await c.env.DB.prepare(
            "INSERT INTO highscores (username, score) VALUES (?, ?)"
        ).bind(user, requestedScore).run();
        c.status(201);
        return c.text("New score is now recorded!");
    }
});
// GET /top10
app.get("/top10", async (c) => {
    const { results } = await c.env.DB.prepare(
        "SELECT * FROM highscores ORDER BY score DESC, username ASC LIMIT 10"
    ).run();
    return c.json(results);
});
// DELETE /user
app.delete("/user", async (c) => {
    const { user } = c.req.query();
    await c.env.DB.prepare(
        "DELETE FROM highscores WHERE username = ?"
    ).bind(user).run();
    return c.text("Your score is deleted.");
});

export default app;