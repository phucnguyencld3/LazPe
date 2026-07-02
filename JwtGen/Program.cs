using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("cf2b59110da2569fb9da9045a612003bfefee9c91d87b6d677c44fea8a0d19c2"));
var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
var claims = new[]
{
    new Claim(ClaimTypes.Role, "Admin"),
    new Claim(ClaimTypes.NameIdentifier, "admin")
};
var token = new JwtSecurityToken(
    issuer: "PolyBabyAPI",
    audience: "PolyBabyWEB",
    claims: claims,
    expires: DateTime.Now.AddHours(1),
    signingCredentials: creds
);
var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
Console.WriteLine(tokenString);
