using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodAdsAI.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPromptHistoryUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "prompt_history",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_prompt_history_UserId_CreatedAt",
                table: "prompt_history",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_prompt_history_users_UserId",
                table: "prompt_history",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_prompt_history_users_UserId",
                table: "prompt_history");

            migrationBuilder.DropIndex(
                name: "IX_prompt_history_UserId_CreatedAt",
                table: "prompt_history");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "prompt_history");
        }
    }
}
