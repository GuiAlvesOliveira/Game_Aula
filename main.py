import asyncio
import pygame
import math
import random

# --- CONFIGURAÇÕES BÁSICAS ---
WIDTH = 800
HEIGHT = 600

# Estados do Jogo
class GameState:
    MENU = 0
    PLAYING = 1
    SHOP = 2
    GAMEOVER = 3

class Player:
    def __init__(self):
        self.x = 0
        self.y = 0
        self.speed = 200
        self.size = 15
        self.points = 0
        
        # Atributos da Arma (A Espada Orbital)
        self.sword_length = 70
        self.sword_speed = 180  # Graus por segundo
        self.sword_damage = 25  # Dano base
        self.sword_angle = 0
        self.double_sword = False

    def reset_position(self):
        self.x = 0
        self.y = 0

class Zombie:
    def __init__(self, x, y, hp):
        self.x = x
        self.y = y
        self.size = 12
        self.speed = 90
        self.hp = hp
        self.max_hp = hp
        self.color = (0, 255, 0) # Verde

class OrbitBladeGame:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Orbit Blade")
        self.clock = pygame.time.Clock()
        
        self.state = GameState.MENU
        self.player = Player()
        self.zombies = []
        self.wave = 1
        self.base_zombies = 5
        
        # Fontes
        self.font = pygame.font.SysFont(None, 36)
        self.large_font = pygame.font.SysFont(None, 72)
        self.small_font = pygame.font.SysFont(None, 24)

    def spawn_wave(self):
        self.zombies.clear()
        self.player.reset_position()
        
        # Fórmula do GDD: Exponencial (Qtd = Base * 1.2^Onda)
        num_zombies = int(self.base_zombies * (1.2 ** (self.wave - 1)))
        # Zumbis ganham +10% de vida a cada onda
        zombie_hp = 20 * (1.1 ** (self.wave - 1))
        
        for _ in range(num_zombies):
            # Spawnar fora da tela para não aparecer em cima do jogador
            angle = random.random() * 2 * math.pi
            dist = random.uniform(WIDTH, WIDTH * 2)
            zx = self.player.x + math.cos(angle) * dist
            zy = self.player.y + math.sin(angle) * dist
            self.zombies.append(Zombie(zx, zy, zombie_hp))

    def update_playing(self, dt):
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        
        # Movimentação WSAD/Setas
        if keys[pygame.K_w] or keys[pygame.K_UP]: dy -= 1
        if keys[pygame.K_s] or keys[pygame.K_DOWN]: dy += 1
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: dx -= 1
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: dx += 1
        
        # Normalizar vetor diagonal para manter velocidade constante
        if dx != 0 and dy != 0:
            norm = (dx**2 + dy**2)**0.5
            dx /= norm
            dy /= norm
            
        self.player.x += dx * self.player.speed * dt
        self.player.y += dy * self.player.speed * dt
        
        # Rotação da Espada
        self.player.sword_angle += self.player.sword_speed * dt
        self.player.sword_angle %= 360
        
        swords = [self.player.sword_angle]
        if self.player.double_sword:
            swords.append((self.player.sword_angle + 180) % 360)
            
        # Atualização dos Zumbis
        for z in self.zombies[:]:
            ang = math.atan2(self.player.y - z.y, self.player.x - z.x)
            z.x += math.cos(ang) * z.speed * dt
            z.y += math.sin(ang) * z.speed * dt
            
            # Checar colisão: Zumbi bateu no jogador?
            dist_p = ((self.player.x - z.x)**2 + (self.player.y - z.y)**2)**0.5
            if dist_p < self.player.size + z.size:
                self.state = GameState.GAMEOVER
                continue
                
            # Checar colisão: Espada(s) atingiu o zumbi?
            for s_ang in swords:
                rad = math.radians(s_ang)
                end_x = self.player.x + math.cos(rad) * self.player.sword_length
                end_y = self.player.y + math.sin(rad) * self.player.sword_length
                
                # Menor distância do centro do zumbi para o segmento de reta da espada
                line_dx = end_x - self.player.x
                line_dy = end_y - self.player.y
                line_len_sq = line_dx**2 + line_dy**2
                
                if line_len_sq > 0:
                    t = max(0, min(1, ((z.x - self.player.x) * line_dx + (z.y - self.player.y) * line_dy) / line_len_sq))
                    proj_x = self.player.x + t * line_dx
                    proj_y = self.player.y + t * line_dy
                    dist_to_sword = ((z.x - proj_x)**2 + (z.y - proj_y)**2)**0.5
                    
                    if dist_to_sword < z.size + 4: # 4 extra de margem para o "fio" da espada
                        # Dano contínuo ajustado pelo tempo
                        z.hp -= self.player.sword_damage * dt * 10
                        if z.hp <= 0:
                            if z in self.zombies:
                                self.zombies.remove(z)
                                self.player.points += 10 # 10 pontos por abate
                        break

        # Verifica se limpou a onda
        if len(self.zombies) == 0:
            self.state = GameState.SHOP

    def draw_text(self, text, x, y, font, color=(255, 255, 255), center=True):
        surf = font.render(text, True, color)
        rect = surf.get_rect()
        if center:
            rect.center = (x, y)
        else:
            rect.topleft = (x, y)
        self.screen.blit(surf, rect)

    async def run_loop(self):
        running = True
        while running:
            # Controle de framerate independente (dt em segundos)
            dt = self.clock.tick(60) / 1000.0
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if self.state == GameState.MENU:
                        if event.key == pygame.K_SPACE:
                            self.wave = 1
                            self.player = Player()
                            self.spawn_wave()
                            self.state = GameState.PLAYING
                            
                    elif self.state == GameState.SHOP:
                        if event.key == pygame.K_1 and self.player.points >= 50:
                            self.player.points -= 50
                            self.player.sword_length += 20
                        elif event.key == pygame.K_2 and self.player.points >= 100:
                            self.player.points -= 100
                            self.player.sword_damage += 15
                        elif event.key == pygame.K_3 and self.player.points >= 200 and not self.player.double_sword:
                            self.player.points -= 200
                            self.player.double_sword = True
                        elif event.key == pygame.K_SPACE:
                            self.wave += 1
                            self.spawn_wave()
                            self.state = GameState.PLAYING
                            
                    elif self.state == GameState.GAMEOVER:
                        revive_cost = 50 * self.wave
                        if event.key == pygame.K_r and self.player.points >= revive_cost:
                            self.player.points -= revive_cost
                            # Empurrar zumbis para longe para evitar morte instantânea
                            for z in self.zombies:
                                dist = ((self.player.x - z.x)**2 + (self.player.y - z.y)**2)**0.5
                                if dist < 250:
                                    ang = math.atan2(z.y - self.player.y, z.x - self.player.x)
                                    z.x += math.cos(ang) * 200
                                    z.y += math.sin(ang) * 200
                            self.state = GameState.PLAYING
                        elif event.key == pygame.K_SPACE:
                            self.state = GameState.MENU

            self.screen.fill((20, 20, 20)) # Fundo escuro
            
            if self.state == GameState.MENU:
                self.draw_text("ORBIT BLADE", WIDTH/2, HEIGHT/2 - 50, self.large_font, (100, 150, 255))
                self.draw_text("Pressione ESPAÇO para Começar", WIDTH/2, HEIGHT/2 + 50, self.font)
                self.draw_text("WASD para Mover  |  Sua espada orbita automaticamente", WIDTH/2, HEIGHT/2 + 100, self.small_font, (150,150,150))
                
            elif self.state == GameState.PLAYING:
                self.update_playing(dt)
                
                # Desenhar Grade (para dar sensação de movimento da câmera)
                grid_size = 80
                offset_x = -self.player.x % grid_size
                offset_y = -self.player.y % grid_size
                for x in range(int(offset_x), WIDTH, grid_size):
                    pygame.draw.line(self.screen, (40, 40, 40), (x, 0), (x, HEIGHT))
                for y in range(int(offset_y), HEIGHT, grid_size):
                    pygame.draw.line(self.screen, (40, 40, 40), (0, y), (WIDTH, y))

                # Desenhar Zumbis
                for z in self.zombies:
                    sx = z.x - self.player.x + WIDTH/2
                    sy = z.y - self.player.y + HEIGHT/2
                    pygame.draw.circle(self.screen, z.color, (int(sx), int(sy)), z.size)
                    
                    # Barra de HP do Zumbi
                    if z.hp < z.max_hp:
                        pygame.draw.rect(self.screen, (255,0,0), (sx-10, sy-20, 20, 4))
                        pygame.draw.rect(self.screen, (0,255,0), (sx-10, sy-20, 20 * (z.hp/z.max_hp), 4))
                
                # Desenhar Jogador (Sempre no Centro)
                px, py = WIDTH/2, HEIGHT/2
                pygame.draw.circle(self.screen, (0, 0, 255), (int(px), int(py)), self.player.size)
                
                # Desenhar Espada(s)
                swords = [self.player.sword_angle]
                if self.player.double_sword:
                    swords.append((self.player.sword_angle + 180) % 360)
                
                for s_ang in swords:
                    rad = math.radians(s_ang)
                    end_x = px + math.cos(rad) * self.player.sword_length
                    end_y = py + math.sin(rad) * self.player.sword_length
                    pygame.draw.line(self.screen, (200, 200, 0), (px, py), (end_x, end_y), 5)
                
                # Interface (HUD)
                self.draw_text(f"Onda: {self.wave}", 20, 20, self.font, center=False)
                self.draw_text(f"Moedas: {self.player.points}", 20, 60, self.font, center=False, color=(255, 200, 0))
                self.draw_text(f"Inimigos Restantes: {len(self.zombies)}", 20, 100, self.font, center=False, color=(0, 255, 0))
                
            elif self.state == GameState.SHOP:
                self.draw_text("LOJA DE UPGRADES", WIDTH/2, 100, self.large_font, (255, 200, 0))
                self.draw_text(f"Seu Saldo: {self.player.points} moedas", WIDTH/2, 180, self.font)
                
                c1 = (0,255,0) if self.player.points >= 50 else (100,100,100)
                self.draw_text("[1] Aumentar Tamanho da Espada (Custo: 50)", WIDTH/2, 250, self.font, c1)
                
                c2 = (0,255,0) if self.player.points >= 100 else (100,100,100)
                self.draw_text("[2] Aumentar Dano Bruto (Custo: 100)", WIDTH/2, 300, self.font, c2)
                
                if self.player.double_sword:
                    self.draw_text("[3] Espada Dupla (MÁXIMO)", WIDTH/2, 350, self.font, (0, 255, 255))
                else:
                    c3 = (0,255,0) if self.player.points >= 200 else (100,100,100)
                    self.draw_text("[3] Equipar Espada Dupla (Custo: 200)", WIDTH/2, 350, self.font, c3)
                
                self.draw_text("Pressione ESPAÇO para Iniciar Próxima Onda", WIDTH/2, 500, self.font, (255, 255, 255))
                
            elif self.state == GameState.GAMEOVER:
                self.draw_text("GAME OVER", WIDTH/2, HEIGHT/2 - 100, self.large_font, (255, 0, 0))
                self.draw_text(f"Você foi aniquilado na Onda {self.wave}...", WIDTH/2, HEIGHT/2 - 20, self.font)
                self.draw_text(f"Saldo restante: {self.player.points} moedas", WIDTH/2, HEIGHT/2 + 20, self.font)
                
                revive_cost = 50 * self.wave
                if self.player.points >= revive_cost:
                    self.draw_text(f"Pressione [R] para Ressuscitar (Custo: {revive_cost} moedas)", WIDTH/2, HEIGHT/2 + 80, self.font, (0, 255, 0))
                else:
                    self.draw_text(f"Você não tem moedas suficientes para reviver ({revive_cost} necessárias).", WIDTH/2, HEIGHT/2 + 80, self.small_font, (150, 150, 150))
                    
                self.draw_text("Pressione ESPAÇO para Voltar ao Menu (Reseta o Progresso)", WIDTH/2, HEIGHT/2 + 130, self.small_font, (255, 255, 255))

            pygame.display.flip()
            
            # MANDATÓRIO para funcionar no PyScript/Browser: ceder controle ao event loop do JS para não travar a aba
            await asyncio.sleep(0)

# Inicialização Assíncrona
if __name__ == "__main__":
    game = OrbitBladeGame()
    asyncio.run(game.run_loop())
