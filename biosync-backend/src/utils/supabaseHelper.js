const { supabase } = require('../config/supabase');

/**
 * Helper functions para queries Supabase
 * Facilita a migração de Sequelize para Supabase
 */

class SupabaseHelper {
  /**
   * Buscar todos os registros
   * @param {string} table - Nome da tabela
   * @param {object} options - Opções de query
   * @returns {Promise<{data, error, count}>}
   */
  static async findAll(table, options = {}) {
    let query = supabase.from(table).select(options.select || '*', {
      count: options.count ? 'exact' : undefined
    });

    // WHERE conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Operators like { gt: 10, lt: 20 }
          Object.entries(value).forEach(([op, val]) => {
            query = query[op](key, val);
          });
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // ORDER BY
    if (options.order) {
      options.order.forEach(([column, direction]) => {
        query = query.order(column, { ascending: direction === 'ASC' });
      });
    }

    // LIMIT
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // OFFSET
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data, count };
  }

  /**
   * Buscar um registro por ID
   * @param {string} table - Nome da tabela
   * @param {string} id - ID do registro
   * @param {object} options - Opções de query
   * @returns {Promise<{data, error}>}
   */
  static async findByPk(table, id, options = {}) {
    const { data, error } = await supabase
      .from(table)
      .select(options.select || '*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { data, error };
  }

  /**
   * Buscar um registro com condições
   * @param {string} table - Nome da tabela
   * @param {object} where - Condições WHERE
   * @param {object} options - Opções de query
   * @returns {Promise<{data, error}>}
   */
  static async findOne(table, where, options = {}) {
    let query = supabase
      .from(table)
      .select(options.select || '*');

    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;

    return { data, error };
  }

  /**
   * Criar um novo registro
   * @param {string} table - Nome da tabela
   * @param {object} data - Dados a inserir
   * @returns {Promise<{data, error}>}
   */
  static async create(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return { data: result, error };
  }

  /**
   * Atualizar um registro
   * @param {string} table - Nome da tabela
   * @param {string} id - ID do registro
   * @param {object} data - Dados a atualizar
   * @returns {Promise<{data, error}>}
   */
  static async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data: result, error };
  }

  /**
   * Deletar um registro
   * @param {string} table - Nome da tabela
   * @param {string} id - ID do registro
   * @returns {Promise<{data, error}>}
   */
  static async delete(table, id) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data, error };
  }

  /**
   * Buscar com JOIN (usando foreign key tables)
   * @param {string} table - Tabela principal
   * @param {string} select - String de select com relações (ex: '*, games(*)')
   * @param {object} where - Condições WHERE
   * @returns {Promise<{data, error}>}
   */
  static async findWithRelations(table, select, where = {}) {
    let query = supabase.from(table).select(select);

    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) throw error;

    return { data, error };
  }

  /**
   * Count registros
   * @param {string} table - Nome da tabela
   * @param {object} where - Condições WHERE
   * @returns {Promise<number>}
   */
  static async count(table, where = {}) {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { count, error } = await query;

    if (error) throw error;

    return count;
  }

  /**
   * Buscar ou criar
   * @param {string} table - Nome da tabela
   * @param {object} where - Condições de busca
   * @param {object} defaults - Dados padrão se não existir
   * @returns {Promise<{data, created}>}
   */
  static async findOrCreate(table, where, defaults = {}) {
    const { data: existing } = await this.findOne(table, where);

    if (existing) {
      return { data: existing, created: false };
    }

    const { data: created } = await this.create(table, { ...where, ...defaults });

    return { data: created, created: true };
  }

  /**
   * Bulk insert
   * @param {string} table - Nome da tabela
   * @param {array} dataArray - Array de objetos a inserir
   * @returns {Promise<{data, error}>}
   */
  static async bulkCreate(table, dataArray) {
    const { data, error } = await supabase
      .from(table)
      .insert(dataArray)
      .select();

    if (error) throw error;

    return { data, error };
  }

  /**
   * Upsert (insert or update)
   * @param {string} table - Nome da tabela
   * @param {object} data - Dados
   * @param {array} onConflict - Colunas únicas para conflict
   * @returns {Promise<{data, error}>}
   */
  static async upsert(table, data, onConflict = ['id']) {
    const { data: result, error } = await supabase
      .from(table)
      .upsert(data, { onConflict: onConflict.join(',') })
      .select()
      .single();

    if (error) throw error;

    return { data: result, error };
  }
}

module.exports = SupabaseHelper;
