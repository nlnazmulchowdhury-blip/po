const fs = require('fs');
const path = require('path');
const dirs = ['dashboard', 'movies', 'comments', 'revenue'];

for (const dir of dirs) {
  const file = path.join('app', 'admin', dir, 'page.tsx');
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');

  // Fix duplicate imports
  content = content.replace(/import \{ AdminSidebar \} from '@\/components\/admin\/AdminSidebar';\nimport \{ AdminSidebar \} from '@\/components\/admin\/AdminSidebar';/g, "import { AdminSidebar } from '@/components/admin/AdminSidebar';");

  // Add missing imports
  if (!content.includes('AdminSidebar')) {
    content = content.replace(/import \{ AdminUserMenu \}.*?\n/, 
      "import { AdminUserMenu } from '@/components/admin/AdminUserMenu';\nimport { AdminSidebar } from '@/components/admin/AdminSidebar';\n");
  }

  fs.writeFileSync(file, content);
  console.log('Fixed imports in ' + file);
}
