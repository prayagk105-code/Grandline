using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Dayform.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailOtps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "email_otps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    OtpHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Attempts = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_otps", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_email_otps_Email",
                table: "email_otps",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_email_otps_ExpiresAtUtc",
                table: "email_otps",
                column: "ExpiresAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email_otps");
        }
    }
}
