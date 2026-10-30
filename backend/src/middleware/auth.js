import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Não autenticado.",
    });
  }

  const token = header.substring(7);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: payload.sub,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Token inválido ou expirado.",
    });
  }
}
