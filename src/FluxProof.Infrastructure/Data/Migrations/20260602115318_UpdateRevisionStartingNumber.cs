using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FluxProof.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRevisionStartingNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Revisions\" SET \"VersionMajor\" = 1, \"VersionMinor\" = \"VersionMinor\" - 1 WHERE \"VersionMajor\" = 0 AND \"VersionMinor\" > 0;");
            migrationBuilder.Sql("UPDATE \"Revisions\" SET \"VersionMajor\" = 1 WHERE \"VersionMajor\" = 0 AND \"VersionMinor\" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Revisions\" SET \"VersionMajor\" = 0, \"VersionMinor\" = \"VersionMinor\" + 1 WHERE \"VersionMajor\" = 1;");
        }
    }
}
