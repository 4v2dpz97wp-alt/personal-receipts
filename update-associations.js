const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/ContactForm.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Find the associationOptions.map block
const oldBlock = `associationOptions.map(c => {
                  const selected = form.associations.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: selected ? 'rgba(99,102,241,0.16)' : 'transparent',
                        marginBottom: 6,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleAssociation(c.id)}
                        style={{ width: 18, height: 18 }}
                      />
                      <span style={{ color: '#fff', fontWeight: 700 }}>{c.primary_username}</span>
                    </label>
                  );
                })}`;

const newBlock = `associationOptions.map(c => {
                  const selected = form.associations.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: selected ? 'rgba(99,102,241,0.16)' : 'transparent',
                        marginBottom: 6,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleAssociation(c.id)}
                        style={{ width: 18, height: 18 }}
                      />
                      {/* Profile Picture / Avatar */}
                      {c.profile_picture ? (
                        <img
                          src={c.profile_picture}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          className="avatar-placeholder"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {c.primary_username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ color: '#fff', fontWeight: 700 }}>{c.primary_username}</span>
                    </label>
                  );
                })}`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content);
  console.log('✅ ContactForm.tsx updated successfully');
} else {
  console.log('❌ Could not find the exact block to replace');
  console.log('The file may have different formatting. Opening in VS Code...');
  process.exit(1);
}
