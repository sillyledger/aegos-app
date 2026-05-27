export const dynamic = "force-dynamic";

export default async function CompanyProfile({ params }: { params: { id: string } }) {
  return (
    <div style={{ padding: "48px" }}>
      <h1>Slug received: {params.id}</h1>
    </div>
  );
}
