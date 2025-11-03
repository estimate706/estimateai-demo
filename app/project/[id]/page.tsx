import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProjectClient from './client';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      measurements: true,
      selections: {
        include: {
          option: true,
        },
      },
      estimates: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      region: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Get all dropdown options grouped by category
  const dropdownOptions = await prisma.dropdownOption.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  const groupedOptions: Record<string, any[]> = {};
  dropdownOptions.forEach((opt) => {
    if (!groupedOptions[opt.category]) {
      groupedOptions[opt.category] = [];
    }
    groupedOptions[opt.category].push(opt);
  });

  return <ProjectClient project={project} dropdownOptions={groupedOptions} />;
}
