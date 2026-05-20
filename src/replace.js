const fs = require('fs');
const path = require('path');
const dirs = ['dashboard', 'movies', 'comments', 'revenue'];

for (const dir of dirs) {
  const file = path.join('app', 'admin', dir, 'page.tsx');
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');

  // Replace adminLinks array
  content = content.replace(/const adminLinks = \[\s*\{.*?\}\s*\];/gs, '');

  // Add import AdminSidebar if not exists
  if (!content.includes('AdminSidebar')) {
    content = content.replace(/import \{ AdminUserMenu \} from '@\/components\/admin\/AdminUserMenu';/, 
      "import { AdminUserMenu } from '@/components/admin/AdminUserMenu';\nimport { AdminSidebar } from '@/components/admin/AdminSidebar';");
  }

  // Replace SidebarContent definition
  content = content.replace(/const SidebarContent = \(\) => \(\s*<div className=\"flex flex-col h-full bg-\[#0f0f0f\]\">.*?<\/div>\s*\);/gs, '');

  // Replace <SidebarContent /> with <AdminSidebar />
  content = content.replace(/<SidebarContent \/>/g, '<AdminSidebar />');

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
